package org.example.blogbackend.controller;

import org.example.blogbackend.entity.Tag;
import org.example.blogbackend.service.TagService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;


@RestController
@RequestMapping("/api/tags")
public class TagController {
    private final TagService tagService;

    public TagController(TagService tagService) {
        this.tagService = tagService;
    }

    @GetMapping
    public List<Tag> list() {
        return tagService.findAll();
    }

    @GetMapping("/{id}")
    public Optional<Tag> get(@PathVariable Integer id) {
        return tagService.findById(id);
    }

    @PostMapping
    public Tag create(@RequestBody Tag tag) {
        return tagService.save(tag);
    }

    @PutMapping("/{id}")
    public Tag update(@PathVariable Integer id, @RequestBody Tag tag) {
        tag.setId(id);
        return tagService.save(tag);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Integer id) {
        tagService.deleteById(id);
    }
}